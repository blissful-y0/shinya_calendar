#!/bin/bash

# Shinya Calendar Release Script
# 이 스크립트는 버전 업데이트, 빌드, 배포를 자동화합니다.

set -e  # 에러 발생 시 중단

echo "🚀 Shinya Calendar Release Script"
echo "=================================="
echo ""

# GH_TOKEN 확인
if [ -z "$GH_TOKEN" ]; then
    echo "❌ 오류: GH_TOKEN 환경 변수가 설정되지 않았습니다."
    echo ""
    echo "다음 명령어로 설정해주세요:"
    echo "export GH_TOKEN=\"your_github_token_here\""
    echo ""
    echo "또는 ~/.zshrc에 추가하여 영구 설정:"
    echo "echo 'export GH_TOKEN=\"your_token\"' >> ~/.zshrc"
    exit 1
fi

echo "✅ GH_TOKEN 확인됨"
echo ""

# 현재 버전 확인
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📦 현재 버전: v$CURRENT_VERSION"
echo ""

# 버전 타입 선택
echo "업데이트 타입을 선택하세요:"
echo "1) patch (버그 수정: $CURRENT_VERSION → $(npm version patch --no-git-tag-version 2>/dev/null; PATCH_VERSION=$(node -p "require('./package.json').version"); git checkout package.json 2>/dev/null; echo $PATCH_VERSION))"
echo "2) minor (새 기능: $CURRENT_VERSION → $(npm version minor --no-git-tag-version 2>/dev/null; MINOR_VERSION=$(node -p "require('./package.json').version"); git checkout package.json 2>/dev/null; echo $MINOR_VERSION))"
echo "3) major (큰 변경: $CURRENT_VERSION → $(npm version major --no-git-tag-version 2>/dev/null; MAJOR_VERSION=$(node -p "require('./package.json').version"); git checkout package.json 2>/dev/null; echo $MAJOR_VERSION))"
echo "4) 커스텀 버전 입력"
echo "5) 취소"
echo ""
read -p "선택 (1-5): " VERSION_CHOICE

case $VERSION_CHOICE in
    1)
        VERSION_TYPE="patch"
        ;;
    2)
        VERSION_TYPE="minor"
        ;;
    3)
        VERSION_TYPE="major"
        ;;
    4)
        read -p "새 버전 번호를 입력하세요 (예: 1.2.3): " CUSTOM_VERSION
        npm version $CUSTOM_VERSION --no-git-tag-version
        NEW_VERSION=$CUSTOM_VERSION
        ;;
    5)
        echo "취소되었습니다."
        exit 0
        ;;
    *)
        echo "잘못된 선택입니다."
        exit 1
        ;;
esac

# 버전 업데이트 (선택 1-3인 경우)
if [ "$VERSION_CHOICE" != "4" ]; then
    yarn version --$VERSION_TYPE --no-git-tag-version
    NEW_VERSION=$(node -p "require('./package.json').version")
fi

echo ""
echo "📦 새 버전: v$NEW_VERSION"
echo ""

# 릴리스 노트 입력
echo "릴리스 노트를 입력하세요 (Enter를 두 번 누르면 완료):"
RELEASE_NOTES=""
while IFS= read -r line; do
    [ -z "$line" ] && break
    RELEASE_NOTES="${RELEASE_NOTES}${line}\n"
done

# 확인
echo ""
echo "=================================="
echo "릴리스 정보 확인"
echo "=================================="
echo "버전: v$CURRENT_VERSION → v$NEW_VERSION"
echo "릴리스 노트:"
echo -e "$RELEASE_NOTES"
echo "=================================="
echo ""
read -p "계속하시겠습니까? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "취소되었습니다."
    git checkout package.json 2>/dev/null || true
    exit 0
fi

# Git 커밋 및 태그
echo ""
echo "📝 Git 커밋 생성 중..."
git add package.json
git commit -m "chore: bump version to $NEW_VERSION"

echo "🏷️  Git 태그 생성 중..."
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

echo "⬆️  GitHub에 푸시 중..."
git push origin master
git push origin "v$NEW_VERSION"

# 빌드 타입 선택
echo ""
echo "빌드할 플랫폼을 선택하세요:"
echo "1) macOS만"
echo "2) Windows만"
echo "3) 모두 (Mac + Windows)"
echo ""
read -p "선택 (1-3): " BUILD_CHOICE

case $BUILD_CHOICE in
    1)
        echo ""
        echo "🔨 macOS 빌드 및 배포 중..."
        yarn build:mac
        ;;
    2)
        echo ""
        echo "🔨 Windows 빌드 및 배포 중..."
        yarn build:win
        ;;
    3)
        echo ""
        echo "🔨 전체 플랫폼 빌드 및 배포 중..."
        yarn build:all
        ;;
    *)
        echo "❌ 잘못된 선택입니다."
        exit 1
        ;;
esac

echo ""
echo "✅ 릴리스 완료!"
echo ""
echo "다음 단계:"
echo "1. GitHub Releases 확인: https://github.com/blissful-y0/shinya_calendar/releases"
echo "2. 릴리스 노트 추가 (선택사항)"
echo "3. 기존 앱에서 업데이트 테스트"
echo ""
echo "🎉 릴리스 v$NEW_VERSION이(가) 성공적으로 배포되었습니다!"

